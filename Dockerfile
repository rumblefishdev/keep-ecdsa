FROM golang:1.13.6-alpine3.10 AS gotools

ENV GOPATH=/go \
	GOBIN=/go/bin \
	APP_NAME=keep-app \
	APP_DIR=/go/src/keep-core \
	BIN_PATH=/usr/local/bin \
	LD_LIBRARY_PATH=/usr/local/lib/ \
	GO111MODULE=on

RUN apk add --update --no-cache \
	g++ \
	linux-headers \
	protobuf \
	git \
	make \
	python && \
	rm -rf /var/cache/apk/ && mkdir /var/cache/apk/ && \
	rm -rf /usr/share/man

COPY --from=ethereum/solc:0.5.17 /usr/bin/solc /usr/bin/solc

FROM gotools AS gobuild

ARG VERSION
ARG REVISION

RUN mkdir -p $APP_DIR

WORKDIR $APP_DIR
COPY . $APP_DIR/

RUN GOOS=linux go build -ldflags "-X main.version=$VERSION -X main.revision=$REVISION" -a -o $APP_NAME ./ && \
	mv $APP_NAME $BIN_PATH

FROM node:15-alpine

ENV APP_NAME=keep-app \
	BIN_PATH=/usr/local/bin

RUN apk add --update --no-cache git geth jq curl python3 && ln -sf python3 /usr/bin/python

RUN curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip" && unzip awscli-bundle.zip
RUN ./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws

RUN npm i -g pm2

COPY --from=gobuild $BIN_PATH/$APP_NAME $BIN_PATH

COPY ./configs/config.local.1.toml ./config.toml
COPY entrypoint.sh .

RUN git clone https://github.com/rumblefishdev/tbtc-rsk-proxy.git proxy
RUN cd proxy/node-http-proxy && npm install
RUN cd proxy && npm install

ENTRYPOINT ["./entrypoint.sh"]

# docker caches more when using CMD [] resulting in a faster build.
CMD []
